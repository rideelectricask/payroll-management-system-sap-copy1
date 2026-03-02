const TechImage = {
    TechImageV1: (props) => {
        const { src, alt, link } = props;
        return (
            <a href={`${link}`} target="_blank"><li>
                <img src={`${src}`} alt={`${alt}`} />
            </li></a>
        );
    }
};

export default TechImage;